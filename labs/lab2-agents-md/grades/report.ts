// print report
import { calc, Load, stat } from "./calc.ts";

let d = Load("./data.json");
let r = calc(d);
let s = stat(r);

console.log("=== " + d.course + " ===");
console.log("");
console.log("ID\tName\tHW\tScore\tGrade");
for (let i = 0; i < r.length; i++) {
  console.log(r[i].id + "\t" + r[i].name + "\t" + r[i].hwAvg.toFixed(1) + "\t" + r[i].score.toFixed(1) + "\t" + r[i].grade);
}
console.log("");
console.log("avg: " + s.avg.toFixed(2));
console.log("pass: " + s.passed + "/" + r.length + " (" + (s.rate * 100).toFixed(0) + "%)");
console.log("max: " + s.max.toFixed(1) + " min: " + s.min.toFixed(1));
