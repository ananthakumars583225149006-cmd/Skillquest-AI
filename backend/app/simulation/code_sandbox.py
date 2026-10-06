"""
Deterministic Python Code Execution Sandbox for CSE Track
Safely executes student code snippets, validates algorithmic assertions,
and returns execution telemetry.
"""

import sys
import io
import time
import traceback
from typing import Dict, Any, List


class CodeSandbox:
    """
    In-process restricted environment for validating CSE track code challenges.
    """

    ALLOWED_BUILTINS = {
        "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool,
        "dict": dict, "enumerate": enumerate, "filter": filter, "float": float,
        "format": format, "int": int, "isinstance": isinstance, "len": len,
        "list": list, "map": map, "max": max, "min": min, "next": next,
        "print": print, "range": range, "reversed": reversed, "round": round,
        "set": set, "sorted": sorted, "str": str, "sum": sum, "tuple": tuple,
        "zip": zip, "None": None, "True": True, "False": False,
        "Exception": Exception, "ValueError": ValueError, "TypeError": TypeError,
        "IndexError": IndexError, "KeyError": KeyError,
    }

    def execute_and_assert(
        self,
        student_code: str,
        test_assertions: List[str],
        timeout_seconds: float = 2.0,
    ) -> Dict[str, Any]:
        """
        Executes student code within restricted scope, then evaluates test assertions.
        """
        # Block malicious syntax
        forbidden_tokens = ["import os", "import sys", "import subprocess", "open(", "__import__", "eval(", "exec("]
        for token in forbidden_tokens:
            if token in student_code:
                return {
                    "is_correct": False,
                    "error": f"Security restriction: '{token}' is not allowed in sandbox.",
                    "stdout": "",
                    "execution_time_ms": 0.0,
                }

        stdout_capture = io.StringIO()
        old_stdout = sys.stdout

        global_scope = {"__builtins__": self.ALLOWED_BUILTINS}
        local_scope = {}

        start_time = time.perf_counter()
        passed_tests = 0
        failed_tests = []

        try:
            sys.stdout = stdout_capture
            # Execute student code definitions
            exec(student_code, global_scope, local_scope)

            # Evaluate each test assertion
            for idx, assertion in enumerate(test_assertions):
                try:
                    result = eval(assertion, global_scope, local_scope)
                    if result:
                        passed_tests += 1
                    else:
                        failed_tests.append(f"Assertion failed: {assertion}")
                except Exception as ex:
                    failed_tests.append(f"Error evaluating test #{idx + 1} ({assertion}): {str(ex)}")

            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            captured_output = stdout_capture.getvalue()

            is_correct = (len(failed_tests) == 0) and (passed_tests > 0 or len(test_assertions) == 0)
            return {
                "is_correct": is_correct,
                "passed_tests": passed_tests,
                "total_tests": len(test_assertions),
                "failed_tests": failed_tests,
                "stdout": captured_output[:2000],
                "execution_time_ms": exec_time_ms,
                "feedback": "All test assertions passed successfully!" if is_correct else f"{len(failed_tests)} test cases failed.",
            }

        except Exception:
            exec_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
            captured_output = stdout_capture.getvalue()
            tb = traceback.format_exc()
            # Clean traceback to show only student relevant lines
            clean_error = "\n".join([line for line in tb.splitlines() if "code_sandbox.py" not in line])
            return {
                "is_correct": False,
                "error": clean_error[-500:],
                "stdout": captured_output[:2000],
                "execution_time_ms": exec_time_ms,
                "feedback": "Execution runtime error encountered.",
            }
        finally:
            sys.stdout = old_stdout


# Global singleton instance
code_sandbox = CodeSandbox()
