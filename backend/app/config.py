import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "LLM Secure Integration Hub"
    DEBUG: bool = True
    
    # Security / Auth Settings
    JWT_SECRET: str = Field(default="super-secure-secret-key-change-in-production-12345", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database Settings
    # Default to sqlite relative to this folder
    DATABASE_URL: str = Field(default="sqlite:///./secure_gateway.db", validation_alias="DATABASE_URL")
    
    # Redis Settings
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    USE_MOCK_REDIS: bool = True  # Fallback to local memory dictionary if true or connection fails
    
    # LLM Provider Keys
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")
    ANTHROPIC_API_KEY: str = Field(default="", validation_alias="ANTHROPIC_API_KEY")
    OLLAMA_HOST: str = Field(default="http://localhost:11434", validation_alias="OLLAMA_HOST")
    
    # Security Firewall Thresholds
    FIREWALL_REJECT_THRESHOLD: int = 70      # Score above this causes prompt rejection
    FIREWALL_REWRITE_THRESHOLD: int = 40     # Score above this causes warning rewrites
    
    # Agent Constraints
    AGENT_MAX_DEPTH: int = 8                 # Max successive tool calls allowed
    AGENT_TIMEOUT: int = 45                  # Max execution seconds per request
    AGENT_SESSION_BUDGET: float = 5.00       # Simulated dollar budget per session before blocking
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
