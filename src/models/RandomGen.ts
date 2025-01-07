
export function random(len: number): string {
    const option = "uhwepfuhqpou9032u9ij4io90";
    const length = option.length;
    let ans = Array(len); 
  
    for (let i = 0; i < len; i++) {
      ans[i] = option[Math.floor(Math.random() * length)];
    }
  
    return ans.join(''); 
  }
  