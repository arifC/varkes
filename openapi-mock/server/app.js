'use strict';


var middleware = require('swagger-express-middleware');
const LOGGER = require("./logger").logger
const bodyParser = require('body-parser');
var mock_controller = require("./mock_controller");
var Resource = require("express-resource")
var app = require("express")();
const path = require("path")

var middlewares = [];
var memoryStores = [];
var MemoryDataStore = middleware.MemoryDataStore;
var varkesConfig

module.exports = function (varkesConfigPath) {
  if (varkesConfigPath) {
    var endpointConfig = path.resolve(varkesConfigPath)
    LOGGER.info("Using configuration %s", endpointConfig)
    varkesConfig = require(endpointConfig)
    configValidation(varkesConfig)
  } else {
    LOGGER.info("Using default configuration")
    varkesConfig = {
      name: 'Varkes',
      apis: [],
      event_spec_path: ''
    }
  }

  app.config = varkesConfig;
  app.use(bodyParser.json());

  mock_controller.init(app, varkesConfig);
  mock_controller.recordRequest(app);
  

  let server;
  app.start = function () {
    server = app.listen(varkesConfig.port | 10000, function () {
      LOGGER.info('OpenAPI Mock is running on port: %d', varkesConfig.port | 10000);
    });
  }

  let myDB = new MemoryDataStore();

  for (var i = 0; i < varkesConfig.apis.length; i++) {
    middlewares.push(
      middleware(varkesConfig.apis[i].specification_file, app, function (err, middleware) {
        app.use(
          middleware.metadata(),
          middleware.CORS(),
          middleware.files(),
          middleware.parseRequest(),
          middleware.validateRequest(),
          middleware.mock(myDB),
        );
        mock_controller.customErrorResponses(app)
      })
    );
  }

  return app;
}

function configValidation(configJson) {
  var error_message = "";
  if (configJson.hasOwnProperty("apis")) {
    var apis = configJson.apis;
    var matchRegex = /^(\/[a-zA-Z0-9]+)+$/
    for (var i = 1; i <= apis.length; i++) {
      var api = apis[i - 1];
      if (!api.name || !api.name.match(/[a-zA-Z0-9]+/)) {
        error_message += "\napi number " + i + ": name does not exist or is in the wrong format";
      }
      if (!api.baseurl || !api.baseurl.match(matchRegex)) {
        error_message += "\napi " + api.name + ": baseurl does not exist or is in the wrong format";
      }
      if (!api.metadata || !api.metadata.match(matchRegex)) {
        error_message += "\napi " + api.name + ": metadata does not exist or is in the wrong format";
      }

      if (!api.oauth || !api.oauth.match(matchRegex)) {
        error_message += "\napi " + api.name + ": oauth does not exist or is in the wrong format";
      }
      if (!api.specification_file || !api.specification_file.match(/[a-zA-Z0-9]+.yaml/)) {
        error_message += "\napi " + api.name + ": specification_file does not exist or is not a yaml file";
      }
    }
  }

  if (error_message != "") {
    throw new Error("Config Error: " + error_message);
  }
}
