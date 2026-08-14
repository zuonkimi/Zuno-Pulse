const Joi = require('joi');
const taskValidateSchema = Joi.object({
  title: Joi.string().min(1).required(),
  description: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'done').optional(),
  deadline: Joi.date().optional().allow(null, ''),
  tags: Joi.array()
    .items(
      Joi.string().valid(
        '安全書類',
        '請求書',
        '発注',
        '注文請書',
        'リモート',
        '領収書',
        '他',
      ),
    )
    .single()
    .empty('')
    .default([]),
  attachments: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        type: Joi.string().valid('image', 'pdf').required(),
        name: Joi.string().required(),
      }),
    )
    .optional(),
}).unknown(true);

module.exports = taskValidateSchema;
