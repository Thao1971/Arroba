"""Workspaces module — persistent memory layer on top of the Copilot.

A Workspace is a persistent working memory: the user doesn't "send queries";
they extend an ongoing conversation about ONE opportunity. Multiple skills
(`analyze`, `value`, `recommend`, `search`) can be triggered inside the same
workspace; their resulting blocks accumulate in chronological order.

Three collections:
  - workspaces        — root document with metadata + access control fields.
  - workspace_messages — chronological log of user/assistant/system turns.
  - workspace_blocks  — ordered list of blocks materialised by the skills.
"""
