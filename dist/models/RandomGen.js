"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = random;
function random(len) {
    let option = "uhwepfuhqpou9032u9ij4io90";
    let length = option.length;
    let ans = "";
    for (let i = 0; i < len; i++) {
        ans += option[Math.floor((Math.random() * length))];
    }
    return ans;
}
