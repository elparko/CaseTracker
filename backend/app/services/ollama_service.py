import requests
import json
from typing import Dict, Any

class OllamaService:
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "medllama2:latest"):
        """Initialize Ollama service"""
        self.base_url = base_url
        self.model = model
        self.generate_url = f"{self.base_url}/api/generate"
    
    async def analyze_case(self, transcription: str) -> Dict[str, Any]:
        """Analyze medical case transcription using Ollama"""
        try:
            prompt = self._create_analysis_prompt(transcription)
            
            response = requests.post(
                self.generate_url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"Ollama API error: {response.status_code} - {response.text}")
                return self._create_fallback_analysis(transcription)
            
            result = response.json()
            analysis_text = result.get("response", "")
            
            # Parse the JSON response from Ollama
            try:
                analysis = json.loads(analysis_text)
                return self._validate_analysis(analysis)
            except json.JSONDecodeError:
                print(f"JSON decode error. Response was: {analysis_text}")
                # Fallback: extract information manually if JSON parsing fails
                return self._extract_fallback_analysis(analysis_text, transcription)
                
        except Exception as e:
            print(f"Exception in analyze_case: {e}")
            # Return basic analysis if Ollama fails
            return self._create_fallback_analysis(transcription)
    
    def _create_analysis_prompt(self, transcription: str) -> str:
        """Create structured prompt for case analysis"""
        return f"""
Analyze this medical case transcription and extract structured information. 
Return your response as valid JSON with the following structure:

{{
    "specialty": "medical specialty (e.g., Internal Medicine, Cardiology, Surgery, Pediatrics, Emergency Medicine)",
    "case_type": "type of case (e.g., acute, chronic, diagnostic, therapeutic, procedural)",
    "complexity": "complexity level (low, medium, high)",
    "patient_demographics": {{
        "age_range": "age range (e.g., 20-30, 60-70, pediatric, geriatric)",
        "gender": "gender if mentioned (male, female, not specified)"
    }},
    "summary": "brief 2-3 sentence summary of the case",
    "key_findings": ["list", "of", "key", "clinical", "findings"],
    "differential_diagnosis": ["list", "of", "possible", "diagnoses"],
    "learning_points": ["key", "learning", "points", "from", "case"],
    "tags": ["relevant", "medical", "tags", "conditions", "symptoms", "procedures", "medications"]
}}

For tags, include relevant medical terms like:
- Medical conditions (e.g., "hypertension", "diabetes", "mi", "copd")
- Symptoms (e.g., "chest-pain", "shortness-of-breath", "fever")
- Procedures (e.g., "ecg", "ct-scan", "surgery")
- Body systems (e.g., "cardiovascular", "respiratory", "neurological")
- Urgency (e.g., "emergency", "routine", "urgent")
- Patient factors (e.g., "elderly", "pediatric", "pregnancy")

Medical case transcription:
{transcription}

Respond only with the JSON object, no additional text:
"""
    
    def _validate_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean the analysis response"""
        # Ensure all required fields are present with defaults
        validated = {
            "specialty": analysis.get("specialty", "General Medicine"),
            "case_type": analysis.get("case_type", "Clinical Case"),
            "complexity": analysis.get("complexity", "medium"),
            "patient_demographics": {
                "age_range": analysis.get("patient_demographics", {}).get("age_range", "not specified"),
                "gender": analysis.get("patient_demographics", {}).get("gender", "not specified")
            },
            "summary": analysis.get("summary", "Medical case requiring analysis"),
            "key_findings": analysis.get("key_findings", []),
            "differential_diagnosis": analysis.get("differential_diagnosis", []),
            "learning_points": analysis.get("learning_points", []),
            "tags": analysis.get("tags", [])
        }
        
        # Ensure lists are actually lists
        for list_field in ["key_findings", "differential_diagnosis", "learning_points", "tags"]:
            if not isinstance(validated[list_field], list):
                validated[list_field] = []
        
        # Clean and normalize tags
        if validated["tags"]:
            cleaned_tags = []
            for tag in validated["tags"]:
                if isinstance(tag, str) and tag.strip():
                    # Convert to lowercase and replace spaces with hyphens
                    clean_tag = tag.strip().lower().replace(" ", "-")
                    cleaned_tags.append(clean_tag)
            validated["tags"] = list(set(cleaned_tags))  # Remove duplicates
        
        # Add automatic tags based on specialty and complexity
        auto_tags = []
        if validated["specialty"]:
            auto_tags.append(validated["specialty"].lower().replace(" ", "-"))
        if validated["complexity"]:
            auto_tags.append(f"complexity-{validated['complexity']}")
        if validated["case_type"]:
            auto_tags.append(validated["case_type"].lower().replace(" ", "-"))
        
        # Merge auto tags with AI-generated tags
        all_tags = list(set(validated["tags"] + auto_tags))
        validated["tags"] = all_tags
        
        return validated
    
    def _extract_fallback_analysis(self, analysis_text: str, transcription: str) -> Dict[str, Any]:
        """Extract basic information if JSON parsing fails"""
        # Basic keyword-based extraction
        specialties = ["cardiology", "neurology", "surgery", "pediatrics", "internal medicine", "emergency"]
        detected_specialty = "General Medicine"
        
        transcription_lower = transcription.lower()
        for specialty in specialties:
            if specialty in transcription_lower:
                detected_specialty = specialty.title()
                break
        
        return {
            "specialty": detected_specialty,
            "case_type": "Clinical Case",
            "complexity": "medium",
            "patient_demographics": {
                "age_range": "not specified",
                "gender": "not specified"
            },
            "summary": f"Medical case transcription: {transcription[:100]}...",
            "key_findings": ["Case requires manual analysis"],
            "differential_diagnosis": [],
            "learning_points": ["Case requires further analysis"],
            "tags": [detected_specialty.lower().replace(" ", "-")]
        }
    
    def _create_fallback_analysis(self, transcription: str) -> Dict[str, Any]:
        """Create basic analysis when Ollama is unavailable"""
        return {
            "specialty": "General Medicine",
            "case_type": "Clinical Case",
            "complexity": "medium",
            "patient_demographics": {
                "age_range": "not specified",
                "gender": "not specified"
            },
            "summary": f"Medical case: {transcription[:150]}..." if len(transcription) > 150 else transcription,
            "key_findings": ["Transcription available for review"],
            "differential_diagnosis": [],
            "learning_points": ["Case documented for future analysis"],
            "tags": ["unprocessed"]
        }