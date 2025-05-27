import jwt from "jsonwebtoken";

export const generateToken = (userId) => {
  console.log(userId);
  const output = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  console.log(output);
  return output;
};
