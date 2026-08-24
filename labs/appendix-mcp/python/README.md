# 寫一個真的 MCP server（Python）

課堂上的 [Lab 3](../../lab3-tools/) 寫的是 **pi 自己的 tool**，跑在 pi 行程裡面。
這裡寫的是**真正的 MCP server**：獨立行程、JSON-RPC 溝通、任何工具都能接。

**這一份完全不需要 pi。** 兩支 Python 檔互相對話，你看得到協定的每一步。

## 裝

```bash
python3 -m venv venv
./venv/bin/pip install mcp
```

> ⚠️ 版本是 **`mcp` 2.0**。網路上 2025 年的教學幾乎都寫 `from mcp.server.fastmcp import FastMCP`
> —— **那個路徑在 2.0 已經不存在了**，`FastMCP` 改名叫 `MCPServer`。

## 跑

```bash
./venv/bin/python probe.py
```

`probe.py` 會啟動 `club_server.py` 當子行程，然後把協定的每一步印出來：

```
── initialize 完成 ──

── tools/list 回了 1 個工具 ──
  name        : club_room_status
  description : 查詢社辦教室現在的使用狀態：裡面有幾個人、鑰匙在哪位幹部身上、借用到幾點。
  input_schema: {"properties": {"room": {"title": "Room", "type": "string"}},
                 "required": ["room"], "type": "object"}

  ↑ 模型看得到的就只有這三樣。位址不在裡面。

── tools/call 的結果 ──
  E205：目前 3 人，鑰匙在器材長身上，借用到 21:00
```

## 為什麼 server 只有 20 行

```python
@mcp.tool()
def club_room_status(room: str) -> str:
    """查詢社辦教室現在的使用狀態：…"""
```

| 你寫的 | 變成什麼 |
| --- | --- |
| 函式名 | 工具的 `name` |
| **docstring** | 工具的 **`description`** ← 模型判斷「要不要用」的依據 |
| type hint `room: str` | `input_schema` 的 `{"type": "string"}` |

比 Lab 3 的 TypeScript 版少一半樣板。

> ⚠️ **docstring 的 `Args:` 區塊不會變成參數的 description。**
> 上面的輸出裡，`room` 只有 `{"title": "Room", "type": "string"}`——沒有說明文字。
> 要給參數寫說明得用 `pydantic.Field`。這是實測出來的，文件沒明講。

## 「呼叫哪裡」是誰決定的

看 `probe.py` 的第一步：

```python
params = StdioServerParameters(command=sys.executable, args=["club_server.py"])
```

**位址在這一行就定了，是使用者設定的。** 模型從頭到尾只拿到
`name` + `description` + `input_schema` 三樣，它不知道 server 在哪、也不需要知道。

換成 Claude Code 或 Cursor，這一行就變成設定檔裡的一段 JSON——**做的事完全一樣**。

## 這跟 Lab 3 差在哪

| | Lab 3 `registerTool` | 這裡的 MCP |
| --- | --- | --- |
| 跑在哪 | pi 行程**內** | **獨立行程** |
| 怎麼溝通 | 直接呼叫 function | **JSON-RPC 2.0** over stdio |
| 語言 | 只能 TS/JS | **任何語言** |
| 換個 agent 還能用嗎 | 不行 | **可以 —— 這就是 MCP 的全部價值** |

## 接到 pi 上呢？

**pi 核心刻意不支援 MCP**（官方 README 寫著 `No MCP`），要自己寫 extension 當橋。

我試過手刻一座（JSON-RPC over stdio，零依賴），**協定的部分會動**，
但 spawn 出來的 server 子行程會把 Node 的 event loop 撐著，pi 答完不會結束，
`child.unref()` 之後仍然不穩定。**所以這條路沒有進課堂。**

想接 MCP 的話，換一個原生支援的工具（Claude Code、Cursor）會省很多事——
這本身就是節 2 那句「概念相同，實作各異」最貴的一個例子。
