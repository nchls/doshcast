module.exports = {
  requireLogin: function(req, res, next) {
    var ref;
    if (!((ref = req.session) != null ? ref.user : void 0)) {
      res.status(401).send({
        isError: true,
        errorCode: 40,
        msg: 'You must be logged in.'
      });
      return;
    }
    return next();
  }
};
