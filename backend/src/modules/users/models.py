from pydantic import BaseModel, ConfigDict


class UpdateMePayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str | None = None
