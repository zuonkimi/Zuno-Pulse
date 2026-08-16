const validate = schema => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    console.log('VALIDATION ERROR:', error.details);
    return res.status(400).send(error.details.map(err => err.message));
  }
  req.validatedBody = value;
  next();
};

module.exports = { validate };
