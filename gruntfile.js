// # Globbing
// for performance reasons we're only matching one level down:
// e.g. 'bar/foo/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// e.g. 'bar/foo/**/*.js'

module.exports = function (grunt) {
  'use strict';

  // show elapsed time at the end
  require('time-grunt')(grunt);

  // load all grunt tasks
  require('load-grunt-tasks')(grunt);

  // Prepare JS Files
  var setupJsFiles = function(jsonConfigFiles, assetsSrc) {
    var
      tempArr     = [],
      tempJsFiles = {};

    for (var key in jsonConfigFiles) {
      tempArr = [];

      for (var i = 0; i < jsonConfigFiles[key].length; i++) {
        tempArr[i] = assetsSrc + '/js/' + jsonConfigFiles[key][i];
      }

      tempJsFiles[ assetsSrc + '/js/' + key] = tempArr;
    }

    return JSON.stringify(tempJsFiles);
  };

  // Need to use var because readJSON can't read <%= templates %>
  var json = grunt.file.readJSON('package.json');

  var jsFiles = JSON.parse(setupJsFiles(grunt.file.readJSON('.jsfilesrc'), json.assetsSrc));

  // Init
  grunt.initConfig({
    pkg: json,

    jsFiles: jsFiles,

    // src: {
    //   css     : '_assets/css/**/*.css',
    //   img     : '_assets/img/**/*.{png,jpg,gif,jpeg}',
    //   js      : '_assets/js/**/*.js',
    //   sass    : '_assets/sass/**/*.sass',
    //   minjs   : '_assets/js/**/*.min.js'
    // },

    src: {
      assetsSrc   : '<%= pkg.assetsSrc %>',
      assetsDist  : '<%= pkg.assetsDist %>',
      css         : '<%= pkg.assetsSrc %>/css',
      img         : '<%= pkg.assetsSrc %>/img',
      js          : '<%= pkg.assetsSrc %>/js',
      sass        : '<%= pkg.assetsSrc %>/sass',
      fonts       : '<%= pkg.assetsSrc %>/fonts'
    },

    // clean all generated files
    clean: {
      all: {
        files: [{
          src: [
            '<%= pkg.assetsDist %>',
            '_site'
          ]
        }]
      }
    },

    // compass config
    compass: {
      compile: {
        options: {
          sassDir         : '<%= src.sass %>',
          cssDir          : '<%= src.css %>',
          imagesDir       : '<%= src.img %>',
          fontsDir        : '<%= src.fonts %>',
          relativeAssets  : true,
          noLineComments  : true,
          quiet           : true,
          outputStyle     : 'expanded'
        }
      }
    },

    cssmin: {
      options: {
        banner: '/*\n * Author: Fridaycode\n * Last build: <%= grunt.template.today("dd-m-yyyy") %>\n*/\n',
      },
      minify: {
        expand: true,
        cwd   : '<%= src.css %>/',
        src   : ['*.css', '!*.min.css'],
        dest  : '<%= src.css %>/',
        ext   : '.min.css'
      }
    },

    // Concat & minify
    uglify: {
      options: {
        banner: '/*\n * Author: Fridaycode\n * Last build: <%= grunt.template.today("dd-m-yyyy") %>\n*/\n',
        report: 'gzip'
      },
      target: {
        options: {
          mangle: true,
          compress: true
        },
        files: ['<%= jsFiles %>']
      }
    },

    // Image Optimization
    imagemin: {
      target: {
        options: {
          optimizationLevel: 3
        },
        files: [{
          expand  : true,
          cwd     : '<%= src.img %>',
          src     : ['**/*.{png,jpg,gif,jpeg}'],
          dest    : '<%= src.img %>'
        }]
      }
    },

    copy: {
      main: {
        files: [
          {
            expand: true,
            filter: 'isFile',
            cwd   : '<%= src.assetsSrc %>',
            src   : ['**', '!**/*.sass', '!**/css/*', '**/*.min.css', '!**/js/*', '**/*.min.js'],
            dest  : '<%= src.assetsDist %>'
          },
        ]
      }
    },

    watch: {
      options: {
        spawn: false
      },
      all: {
        files: ['<%= src.assetsSrc %>/**'],
        tasks: ['compass', 'newer:cssmin', 'newer:uglify', 'newer:imagemin', 'newer:copy']
      }
    },

    jekyll: {
      options: {
        bundleExec: true
      },
      serve: {
        options: {
          serve: true,
          watch: true
        }
      },
      build: {

      }
    },

    concurrent: {
      target: {
        tasks: [
          'watch:all',
          'jekyll:serve'
        ],
        options: {
          logConcurrentOutput: true
        }
      }
    }
  });

  // Tasks
  grunt.registerTask('default', [
    'clean',
    'compass',
    'cssmin',
    'uglify',
    'imagemin',
    'copy',
    'concurrent'
  ]);

  grunt.registerTask('build', [
    'clean',
    'compass',
    'cssmin',
    'uglify',
    'imagemin',
    'copy',
    'jekyll:build'
  ]);
};
