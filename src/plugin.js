const { declare } = require("@babel/helper-plugin-utils");
const importModule = require("@babel/helper-module-imports");
const template = require("@babel/template").default
const types = require('@babel/types')
const autoTrackPlugin = declare((api,options, dirname) => {
  api.assertVersion(7);
  return {
    visitor: {
      Program: {
        enter(path, state) {
          path.traverse({
            ImportDeclaration(curPath) {
              const requirePath = curPath.get("source").node.value;
              if (requirePath === options.trackerPath) {
                const specifierPath = curPath.get("specifiers.0");
                if (specifierPath.isImportSpecifier()) {
                  state.trackerImportId = specifierPath.toString();
                } else if (specifierPath.isImportNamespaceSpecifier()) {
                  state.trackerImportId = specifierPath.get("local").toString();
                }
                path.stop();
              }
            },
          });
          if (!state.trackerImportId) {
            state.trackerImportId = importModule.addDefault(path, "tracker", {
              nameHint: path.scope.generateUid("tracker"),
            }).name;
            state.trackerAST = api.template.statement(
              `${state.trackerImportId}()`
            )();
          }
        },
      },
      ExportDefaultDeclaration:{
        exit(path,state){
          const a = path.get("declaration")
          const ast = types.exportDefaultDeclaration(
            types.callExpression(
              types.identifier('test'),
              [
                a
              ]
            )
          )
          // todo: replaceWith throw error
          path.replaceWith(ast)
          path.skip()
        }
      }

    },
  };
});
// plugin.js
module.exports = autoTrackPlugin;
