function getHealth(_request, response) {
  response.status(200).json({
    status: "ok",
    service: "robotactic-backend",
  });
}

module.exports = { getHealth };
