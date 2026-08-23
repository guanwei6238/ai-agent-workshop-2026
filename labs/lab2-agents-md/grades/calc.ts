// grade calculator
import * as fs from "fs";

export function calc(d: any) {
  let r: any = [];
  for (let i = 0; i < d.students.length; i++) {
    let s: any = d.students[i];
    // sum homework
    let t = 0;
    for (let j = 0; j < s.hw.length; j++) {
      t = t + s.hw[j];
    }
    let hwAvg = t / s.hw.length;
    // 0.3 hw, 0.3 midterm, 0.4 final
    let score = hwAvg * 0.3 + s.midterm * 0.3 + s.final * 0.4;
    // attendance bonus
    if (s.attendance >= 15) {
      score = score + 3;
    }
    if (s.attendance < 10) {
      score = score - 5;
    }
    if (score > 100) score = 100;
    if (score < 0) score = 0;
    let g = "";
    if (score >= 90) { g = "A"; }
    else if (score >= 80) { g = "B"; }
    else if (score >= 70) { g = "C"; }
    else if (score >= 60) { g = "D"; }
    else { g = "F"; }
    r.push({ id: s.id, name: s.name, hwAvg: hwAvg, score: score, grade: g, pass: score >= 60 });
  }
  return r;
}

export function Load(p: any) {
  let x = fs.readFileSync(p, "utf8");
  return JSON.parse(x);
}

// get statistics
export function stat(r: any) {
  let total = 0;
  let passed = 0;
  let max = -1;
  let min = 999;
  for (let i = 0; i < r.length; i++) {
    total += r[i].score;
    if (r[i].pass) passed++;
    if (r[i].score > max) max = r[i].score;
    if (r[i].score < min) min = r[i].score;
  }
  return { avg: total / r.length, passed: passed, rate: passed / r.length, max: max, min: min };
}
