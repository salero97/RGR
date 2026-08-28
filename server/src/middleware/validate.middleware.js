function validateBody(schema) {
  return function (req, res, next) {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: false });

    if (error) {
      return res.status(422).json({
        status: 422,
        message: error.details.map((d) => d.message).join('; ')
      });
    }

    req.body = value;
    next();
  };
}

function validateQuery(schema) {
  return function (req, res, next) {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: false });

    if (error) {
      return res.status(422).json({
        status: 422,
        message: error.details.map((d) => d.message).join('; ')
      });
    }

    req.query = value;
    next();
  };
}

module.exports = { validateBody, validateQuery };