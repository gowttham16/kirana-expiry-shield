import os
from dotenv import load_dotenv
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import FAISS
from db import supabase

load_dotenv()

# Initialize Embeddings and Groq LLM
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
llm = ChatGroq(
    temperature=0, 
    groq_api_key=os.getenv("GROQ_API_KEY"), 
    model_name="openai/gpt-oss-20b"
)

def get_inventory_documents():
    # Fetch data using the exact join structure from your main.py
    response = supabase.table("inventory_batches").select(
        "id, batch_number, quantity, expiry_date, barcode, products(name, category, mrp)"
    ).execute()
    items = response.data
    
    docs = []
    for item in items:
        # Extract the nested product details safely
        product_info = item.get("products") or {}
        name = product_info.get("name", "Unknown")
        category = product_info.get("category", "Unknown")
        mrp = product_info.get("mrp", 0)
        
        # Format the database row into a readable sentence for the AI
        content = f"Product: {name}, Barcode: {item.get('barcode')}, Quantity: {item.get('quantity')}, Expiry Date: {item.get('expiry_date')}, MRP: Rs {mrp}, Category: {category}"
        
        docs.append(Document(page_content=content, metadata={"id": str(item.get('id'))}))
        
    return docs


def ask_inventory_question(user_query: str):
    docs = get_inventory_documents()
    
    if not docs:
        return "There is no inventory data available in the database yet."

    # Process vector embeddings using FAISS
    vector_store = FAISS.from_documents(docs, embeddings)
    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    system_prompt = (
        "You are an AI assistant for a Kirana store inventory system. "
        "Use the provided retrieved inventory context to answer the store owner's question. "
        "Keep your answer concise, professional, and directly state quantities or financial risks. "
        "If the context does not contain the answer, say you don't know.\n\n"
        "Context: {context}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    response = rag_chain.invoke({"input": user_query})
    return response["answer"]