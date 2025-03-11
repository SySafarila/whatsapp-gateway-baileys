import Joi from 'joi';
import { SendMessage } from '../type/request';

export default class ValidateSendMessage {
  public static async sendMessage(request: SendMessage): Promise<void> {
    const schema: Joi.ObjectSchema<SendMessage> = Joi.object({
      message: Joi.string().required(),
      phone_number: Joi.number().required(),
    });

    const options: Joi.ValidationOptions = {
      abortEarly: false,
    };

    await schema.validateAsync(request, options);
  }
}
