import express, { expressPort } from './express';
import { connectToWhatsApp } from './whatsApp';

connectToWhatsApp()
  .then(() => {
    express.listen(expressPort, () => {
      console.info(`Express server running on port ${expressPort}`);
    });
  })
  .catch((er) => {
    console.error(er);
    process.exit(1);
  });
