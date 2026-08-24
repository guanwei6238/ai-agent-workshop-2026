"""當一次 MCP client，把協定的每一步印出來。

    python probe.py

這支程式做的事，跟 Claude Code / Cursor 接上一個 MCP server 時做的事一模一樣。
"""
import asyncio
import json
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


async def main() -> None:
    # 1. 啟動 server 當子行程 —— 「呼叫哪裡」在這一行就決定了
    params = StdioServerParameters(command=sys.executable, args=["club_server.py"])

    async with stdio_client(params) as (read, write):
        async with ClientSession(read, write) as session:
            # 2. 握手
            await session.initialize()
            print("── initialize 完成 ──\n")

            # 3. 問它有哪些工具。這一步就是 MCP 的核心
            listed = await session.list_tools()
            print(f"── tools/list 回了 {len(listed.tools)} 個工具 ──")
            for tool in listed.tools:
                print(f"  name        : {tool.name}")
                print(f"  description : {(tool.description or '').splitlines()[0]}")
                print(f"  input_schema: {json.dumps(tool.input_schema, ensure_ascii=False)}")
            print()
            print("  ↑ 模型看得到的就只有這三樣。位址不在裡面。\n")

            # 4. 呼叫
            result = await session.call_tool("club_room_status", {"room": "E205"})
            print("── tools/call 的結果 ──")
            print(" ", result.content[0].text)


if __name__ == "__main__":
    asyncio.run(main())
