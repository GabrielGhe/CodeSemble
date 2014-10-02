"use strict";

module.exports = function(grunt){
  require("load-grunt-tasks")(grunt);
  grunt.initConfig({
    
    // Concat
    concat:{
      dist: {
        src: ["public/javascripts/receiveEventHandler.js", "public/javascripts/sendEventHandler.js", "public/javascripts/myScript.js"],
        dest: "public/javascripts/build.js"
      }
    },

    // Clean
    clean: {
      build: {
        src: ["public/javascripts/build.js"]
      },
      buildmin: {
        src: ["public/javascripts/build.js"]
      }
    },

    // Uglify
    uglify: {
      options: {
          mangle: {
              toplevel: true
          },
          compress: true
      },
      my_target: {
          files: {
              'public/javascripts/build.min.js': ["public/javascripts/build.js"]
          }
      }
    }
  });

  grunt.registerTask("default", ["clean", "concat", "uglify", "clean:build"]);
};