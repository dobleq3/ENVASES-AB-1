from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Line(BaseModel):
    line_id: str
    product: str
    next_product: str
    status: str
    operator: str

    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    end_estimate: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    duration: Optional[str] = None
    alerts: List[str] = []

    model_config = {
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }
