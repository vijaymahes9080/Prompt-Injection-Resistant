import re
from typing import List, Dict, Any, Tuple
from app.security.firewall import scan_input

class SecureRAG:
    def __init__(self):
        # Memory storage for RAG documents
        # Schema: {"id": int, "source": str, "content": str, "trust_score": float, "is_safe": bool}
        self.documents: List[Dict[str, Any]] = []
        self._doc_counter = 1
        
    def sanitize_document_text(self, text: str) -> str:
        """
        Cleans input document content.
        Strips HTML, script tags, zero-width characters, and dangerous control symbols.
        """
        if not text:
            return ""
        # Remove script tags and style blocks
        cleaned = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", text, flags=re.IGNORECASE)
        cleaned = re.sub(r"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", "", cleaned, flags=re.IGNORECASE)
        
        # Remove raw HTML tags entirely (keep content)
        cleaned = re.sub(r"<[^>]+>", "", cleaned)
        
        # Remove zero-width spaces and other control characters
        cleaned = "".join(ch for ch in cleaned if unicodedata_category(ch) != "Cf")
        
        return cleaned.strip()

    def add_document(self, content: str, source_type: str = "user_upload") -> Tuple[bool, str, int]:
        """
        Processes and adds a document chunk.
        Checks for indirect injection vectors in the document content.
        """
        cleaned = self.sanitize_document_text(content)
        
        # Scan chunk for prompt injection payloads (e.g. indirect system override instructions)
        scan_res = scan_input(cleaned)
        risk_score = scan_res["score"]
        
        # Define baseline source trust score
        # Administrator docs: 1.0, user uploads: 0.6, external web scrapes: 0.3
        source_trust = 0.6
        if source_type == "admin_db":
            source_trust = 1.0
        elif source_type == "web_scrape":
            source_trust = 0.3
            
        # Lower trust score if suspicious content is flagged but not rejected
        if risk_score > 30:
            source_trust = max(0.1, source_trust - (risk_score / 100.0))
            
        is_safe = risk_score < 70  # Reject if risk is high
        
        if not is_safe:
            return False, f"Document blocked: Prompt injection threat detected (Risk Score: {risk_score}).", risk_score
            
        doc_id = self._doc_counter
        self.documents.append({
            "id": doc_id,
            "content": cleaned,
            "source_type": source_type,
            "trust_score": source_trust,
            "risk_score": risk_score
        })
        self._doc_counter += 1
        return True, f"Document successfully ingested with Trust Score: {source_trust:.2f}.", risk_score

    def retrieve_context(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """
        Performs a simple keyword-based vector simulation search to find related text blocks.
        Attaches source attributions and trust values to matched items.
        """
        query_words = set(query.lower().split())
        scored_docs = []
        
        for doc in self.documents:
            doc_content_lower = doc["content"].lower()
            # Simple keyword overlap scoring
            overlap = sum(1 for word in query_words if word in doc_content_lower)
            if overlap > 0:
                scored_docs.append((overlap, doc))
                
        # Sort by overlap score descending, then by trust score descending
        scored_docs.sort(key=lambda x: (x[0], x[1]["trust_score"]), reverse=True)
        
        # Format results
        results = []
        for _, doc in scored_docs[:top_k]:
            results.append({
                "content": doc["content"],
                "source": doc["source_type"],
                "trust_score": doc["trust_score"]
            })
        return results

# Helper to import unicodedata inside helper scope
def unicodedata_category(ch: str) -> str:
    import unicodedata
    return unicodedata.category(ch)
