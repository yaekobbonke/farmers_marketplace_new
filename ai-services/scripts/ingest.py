import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

DATA_PATH = "./data/manuals"
CHROMA_PATH = "chroma_db"

def run_ingestion():
    print(f"Loading PDFs from {DATA_PATH}...")
    loader = PyPDFDirectoryLoader(DATA_PATH)
    raw_documents = loader.load()

    print("Example raw document metadata:")
    if raw_documents:
        print(raw_documents[0].metadata)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=10000,
        chunk_overlap=100,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(raw_documents)

    # Ensure expected metadata keys exist
    for d in chunks:
        d.metadata["source"] = d.metadata.get("source", "Unknown Document")
        d.metadata["page"] = d.metadata.get("page", "?")

    print(f"Split into {len(chunks)} chunks.")

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    print("Saving to Vector Database...")
    Chroma.from_documents(
        chunks,
        embeddings,
        persist_directory=CHROMA_PATH
    )

    print(f"Success! Knowledge base created at {CHROMA_PATH}")

if __name__ == "__main__":
    run_ingestion()