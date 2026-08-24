"""一個真的 MCP server。整個檔案就這麼長。

跑起來：
    pip install mcp
    python club_server.py        # 它會安靜地等在那裡，用 probe.py 去戳它
"""
from mcp.server import MCPServer

mcp = MCPServer("club-rooms")

ROOMS = {
    "E205": {"occupied": 3, "key_holder": "器材長", "booked_until": "21:00"},
    "E204": {"occupied": 0, "key_holder": "社長", "booked_until": None},
    "E301": {"occupied": 1, "key_holder": "活動長", "booked_until": "18:30"},
}


@mcp.tool()
def club_room_status(room: str) -> str:
    """查詢社辦教室現在的使用狀態：裡面有幾個人、鑰匙在哪位幹部身上、借用到幾點。

    當使用者問到社辦現在方不方便去、有沒有人、鑰匙在誰那裡的時候使用。
    這是社團內部資料，網路上查不到。
    """
    status = ROOMS.get(room)
    if status is None:
        return f"查無 {room} 這間教室"
    if status["booked_until"]:
        return (
            f"{room}：目前 {status['occupied']} 人，"
            f"鑰匙在{status['key_holder']}身上，借用到 {status['booked_until']}"
        )
    return f"{room}：現在沒有人，鑰匙在{status['key_holder']}身上"


if __name__ == "__main__":
    mcp.run()  # 預設 transport 就是 stdio
