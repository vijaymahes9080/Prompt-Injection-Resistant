from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ToolDefinition
from app.schemas import ToolDefinitionCreate, ToolDefinitionOut
from app.routers.auth import RoleChecker, get_current_user

router = APIRouter(
    prefix="/api/tools",
    tags=["Tool Registry"]
)

# Allowed roles for writing/editing tools
operator_admin_roles = RoleChecker(["admin", "operator"])

@router.get("", response_model=List[ToolDefinitionOut])
def list_tools(db: Session = Depends(get_db)):
    """
    Returns all tools registered in the hub.
    """
    return db.query(ToolDefinition).all()

@router.post("", response_model=ToolDefinitionOut, status_code=status.HTTP_201_CREATED)
def register_tool(
    tool_in: ToolDefinitionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(operator_admin_roles)
):
    """
    Registers a new tool in the security registry. (Admin & Operator only)
    """
    # Check if name exists
    existing = db.query(ToolDefinition).filter(ToolDefinition.name == tool_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tool '{tool_in.name}' is already registered."
        )
        
    new_tool = ToolDefinition(
        name=tool_in.name,
        description=tool_in.description,
        parameters_schema=tool_in.parameters_schema,
        risk_level=tool_in.risk_level,
        requires_approval=tool_in.requires_approval,
        is_enabled=tool_in.is_enabled
    )
    db.add(new_tool)
    db.commit()
    db.refresh(new_tool)
    return new_tool

@router.put("/{tool_id}", response_model=ToolDefinitionOut)
def update_tool(
    tool_id: int, 
    tool_in: ToolDefinitionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(operator_admin_roles)
):
    """
    Updates tool specifications and safety requirements. (Admin & Operator only)
    """
    tool = db.query(ToolDefinition).filter(ToolDefinition.id == tool_id).first()
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
        
    tool.name = tool_in.name
    tool.description = tool_in.description
    tool.parameters_schema = tool_in.parameters_schema
    tool.risk_level = tool_in.risk_level
    tool.requires_approval = tool_in.requires_approval
    tool.is_enabled = tool_in.is_enabled
    
    db.commit()
    db.refresh(tool)
    return tool
