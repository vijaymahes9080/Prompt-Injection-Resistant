import time
from typing import List, Dict, Any, Optional

class AgentSessionLimitException(Exception):
    pass

class AgentRuntimeSecurity:
    def __init__(
        self, 
        max_depth: int = 8, 
        timeout_seconds: int = 45, 
        budget_limit: float = 5.0
    ):
        self.max_depth = max_depth
        self.timeout_seconds = timeout_seconds
        self.budget_limit = budget_limit
        
        # State tracking per session
        self.depth_count = 0
        self.start_time = 0.0
        self.accumulated_budget = 0.0
        self.executed_calls: List[str] = [] # Tracks unique tool signature to detect infinite loops

    def start_session(self):
        """
        Registers session timer starting point and resets steps.
        """
        self.depth_count = 0
        self.start_time = time.time()
        self.accumulated_budget = 0.0
        self.executed_calls.clear()

    def check_constraints(self, next_tool_cost: float = 0.0):
        """
        Verifies depth, timeout, loop indicators, and dollar budgets.
        """
        # 1. Depth check
        if self.depth_count >= self.max_depth:
            raise AgentSessionLimitException(
                f"Agent Security Violation: Execution call stack limit exceeded ({self.max_depth} depth limit)."
            )
            
        # 2. Timeout check
        elapsed = time.time() - self.start_time
        if elapsed > self.timeout_seconds:
            raise AgentSessionLimitException(
                f"Agent Security Violation: Execution time exceeded timeout threshold ({self.timeout_seconds} seconds)."
            )
            
        # 3. Budget check
        if self.accumulated_budget + next_tool_cost > self.budget_limit:
            raise AgentSessionLimitException(
                f"Agent Security Violation: Financial budget quota exceeded. Limit: ${self.budget_limit:.2f}, Spent: ${self.accumulated_budget:.2f}."
            )

    def record_step(self, tool_name: str, params: Dict[str, Any], cost: float):
        """
        Increments step counter, checks for loops, and aggregates budget.
        """
        self.depth_count += 1
        self.accumulated_budget += cost
        
        # Loop prevention: Check if the exact same tool is called with exact same params
        # more than 2 times consecutively.
        call_signature = f"{tool_name}:{json_dumps_fallback(params)}"
        self.executed_calls.append(call_signature)
        
        # Look at last 3 calls. If the last 3 calls are identical, we have an active loop cycle.
        if len(self.executed_calls) >= 3:
            if self.executed_calls[-1] == self.executed_calls[-2] == self.executed_calls[-3]:
                raise AgentSessionLimitException(
                    "Agent Security Violation: Infinite tool loop detected (duplicate calls back-to-back)."
                )

def json_dumps_fallback(obj: Any) -> str:
    import json
    try:
        return json.dumps(obj, sort_keys=True)
    except Exception:
        return str(obj)
