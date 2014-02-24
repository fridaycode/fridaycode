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

  // setupJsFiles
  var setupJsFiles = function(jsonConfigFiles, pkgName) {
    var
      tempArr     = [],
      tempJsFiles = {};

    for (var key in jsonConfigFiles) {
      tempArr = [];

      for (var i = 0; i < jsonConfigFiles[key].length; i++) {
        tempArr[i] = pkgName + '/assets/js/source/' + jsonConfigFiles[key][i];
      }

      tempJsFiles[ pkgName + '/assets/js/dist/' + key] = tempArr;
    }

    return JSON.stringify(tempJsFiles);
  };

  // Need to use var because readJSON can't read <%= templates %>
  var json = grunt.file.readJSON('package.json');

  var jsFiles = JSON.parse(setupJsFiles(grunt.file.readJSON('.jsfilesrc'), json.source));

  // Init
  grunt.initConfig({
    pkg: json,

    jsFiles: jsFiles,

    src: {
      sass   : '<%= pkg.source %>/assets/sass/**/*.sass',
      css    : '<%= pkg.source %>/assets/css/**/*.css',
      mincss : '<%= pkg.source %>/assets/css/**/*.min.css',
      js     : '<%= pkg.source %>/assets/js/source/**/*.js',
      minjs  : '<%= pkg.source %>/assets/js/dist/**/*.min.js'
    },

    // clean all generated files
    clean: {
      all: {
        files: [{
          src: [
            '<%= src.css %>',
            '<%= src.minjs %>'
          ]
        }]
      }
    },

    // compass config
    compass: {
      compile: {
        options: {
          sassDir: '<%= pkg.source %>/assets/sass/',
          cssDir: '<%= pkg.source %>/assets/css/',
          imagesDir: '<%= pkg.source %>/assets/img/source',
          fontsDir: '<%= pkg.source %>/assets/fonts',
          relativeAssets: true,
          noLineComments: true,
          quiet: true,
          outputStyle: 'expanded'
        }
      }
    },

    cssmin: {
      options: {
        banner: '/*\n * Author: RaceCloud\n * Last build: <%= grunt.template.today("dd-m-yyyy") %>\n*/\n',
      },
      minify: {
        expand: true,
        cwd: '<%= pkg.source %>/assets/css/',
        src: ['*.css', '!*.min.css'],
        dest: '<%= pkg.source %>/assets/css/',
        ext: '.min.css'
      }
    },

    // Concat & minify
    uglify: {
      options: {
        banner: '/*\n * Author: RaceCloud\n * Last build: <%= grunt.template.today("dd-m-yyyy") %>\n*/\n',
        report: 'gzip'
      },
      dev: {
        options: {
          mangle: false,
          compress: false,
          preserveComments: 'all',
          beautify: true,
        },
        files: ['<%= jsFiles %>']
      },
      dist: {
        options: {
          mangle: true,
          compress: true,
        },
        files: ['<%= jsFiles %>']
      }
    },

    // Image Optimization
    imagemin: {
      dist: {
        options: {
          optimizationLevel: 3
        },
        files: [
          {
            expand: true,
            cwd: '<%= pkg.source %>/assets/img/source/',
            src: ['**/*.{png,jpg,gif,jpeg}'],
            dest: '<%= pkg.source %>/assets/img/dist/'
          }
        ]
      }
    },

    watch: {
      options: {
        spawn: false
      },
      styles_dev: {
        files: ['<%= src.sass %>'],
        tasks: ['compass', 'newer:cssmin', 'newer:imagemin']
      },
      scripts_dev: {
        files: ['<%= src.js %>'],
        tasks: ['any-newer:uglify:dev']
      },
      styles_dist: {
        files: ['<%= src.sass %>'],
        tasks: ['compass', 'newer:cssmin', 'newer:imagemin']
      },
      scripts_dist: {
        files: ['<%= src.js %>'],
        tasks: ['any-newer:uglify:dist']
      }
    },

    concurrent: {
      dev: {
        tasks: ['watch:styles_dev', 'watch:scripts_dev', 'jekyll:serve'],
        options: {
          logConcurrentOutput: true
        }
      },
      dist: {
        tasks: ['watch:styles_dist', 'watch:scripts_dist'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    jekyll: {                             // Task
      options: {                          // Universal options
        bundleExec: true,
        src : '<%= pkg.source %>'
      },

      serve : {
        options: {
          bundleExec: true,
          src : '<%= pkg.source %>',
          serve: true
        }
      },
    }
  });

  // Tasks
  grunt.registerTask('default', [
    'clean',
    'compass',
    'newer:cssmin',
    'newer:uglify:dist',
    'concurrent:dist'
  ]);

  grunt.registerTask('dev', [
    'clean',
    'compass',
    'newer:uglify:dev',
    'concurrent:dev'
  ]);

  grunt.registerTask('build', [
    'clean',
    'compass',
    'cssmin',
    'uglify:dist',
    'imagemin',
    'jekyll'
  ]);

};
