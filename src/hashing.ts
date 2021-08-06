import { randomBytes, pbkdf2 } from "crypto";

const hashPass = (password) => {
  const salt = randomBytes(64).toString("base64");
  const iterations = 1000;

  pbkdf2(password, salt, iterations, 64, "sha512", (err, hash) => {
    if (err) throw err;
    let res = {
      salt: salt,
      hash: hash.toString("base64"),
      iterations: iterations,
    };
    console.log(res);
  });
};
