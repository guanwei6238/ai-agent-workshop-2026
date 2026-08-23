/** 使用者的操作錯誤。這種錯誤只印訊息，不印 stack。 */
export class UserError extends Error {}

/** 丟出一個使用者錯誤。所有對使用者的抱怨都走這裡。 */
export function fail(message: string): never {
  throw new UserError(message);
}
