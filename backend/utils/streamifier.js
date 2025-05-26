import { createReadStream } from "fs";
import { Readable } from "stream";

export const streamifier = {
  createReadStream: (buffer) => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  },
};
