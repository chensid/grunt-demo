const loadGruntTasks = require('load-grunt-tasks');
const ghpages = require('gh-pages');
const path = require('path');

module.exports = (grunt) => {
  // 自动加载 grunt 插件任务
  loadGruntTasks(grunt);
  // 项目配置
  grunt.initConfig({
    clean: {
      //清除目标文件下文件
      main: {
        src: ['temp/', 'dist/'],
      },
      temp: {
        src: 'temp/',
      },
    },
    stylelint: {
      options: {
        configFile: '.stylelintrc.json',
        formatter: 'string',
        ignoreDisables: false,
        failOnError: true,
        outputFile: '',
        reportNeedlessDisables: false,
      },
      src: ['src/**/*.scss'],
    },
    eslint: {
      main: {
        files: [
          {
            src: ['src/**/*.js'],
          },
        ],
      },
    },
    swig: {
      main: {
        options: {
          data: {
            menu: [{}, {}],
            pkg: require('./package.json'),
            date: new Date(),
          },
        },
        files: [
          {
            expand: true,
            cwd: 'src',
            src: ['*.html'],
            dest: 'temp/',
            ext: '.html',
          },
        ],
      },
    },
    babel: {
      main: {
        options: {
          presets: ['@babel/preset-env'],
        },
        files: [
          {
            expand: true,
            cwd: 'src',
            src: '**/*.js',
            dest: 'temp/',
          },
        ],
      },
    },
    sass: {
      main: {
        options: {
          sourceMap: false,
        },
        files: [
          {
            expand: true,
            cwd: 'src/',
            src: ['**/*.scss'],
            dest: 'temp/',
            ext: '.css',
          },
        ],
      },
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: 'public/',
            src: '**',
            dest: 'dist/',
            flatten: false,
            filter: 'isFile',
          },
          {
            expand: true,
            cwd: 'src/',
            src: ['assets/fonts/**'],
            dest: 'dist',
          },
        ],
      },
    },
    imagemin: {
      main: {
        options: {
          optimizationLevel: 1,
        },
        files: [
          {
            expand: true,
            cwd: 'src',
            src: ['**/*.{png,jpg,gif,svg}'],
            dest: 'dist',
          },
        ],
      },
    },
    useref: {
      html: 'temp/**/*.html',
      temp: 'temp',
    },
    htmlmin: {
      //压缩html
      main: {
        options: {
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true,
        },
        files: [
          {
            expand: true,
            cwd: 'temp/',
            src: ['*.html'],
            dest: 'dist/',
            ext: '.html',
            extDot: 'first',
          },
        ],
      },
    },
    cssmin: {
      //压缩css
      main: {
        files: [
          {
            expand: true,
            cwd: 'temp/',
            src: ['**/*.css'],
            dest: 'dist',
            ext: '.css',
          },
        ],
      },
    },
    uglify: {
      //压缩js文件
      main: {
        files: [
          {
            expand: true,
            cwd: 'temp/',
            src: ['**/*.js'],
            dest: 'dist',
            ext: '.js',
          },
        ],
      },
    },
    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['babel'],
      },
      css: {
        files: ['src/**/*.scss'],
        tasks: ['sass'],
      },
      html: {
        files: ['src/**/*.html'],
        tasks: ['swig'],
      },
    },
    browserSync: {
      dev: {
        bsFiles: {
          src: ['temp/**/*'],
        },
        options: {
          watchTask: true,
          port: 2020,
          open: true,
          server: {
            baseDir: './temp',
            routes: {
              '/assets/fonts': 'dist/assets/fonts',
              '/assets/images': 'dist/assets/images',
              '/node_modules': 'node_modules',
            },
          },
        },
      },
      start: {
        bsFiles: {
          src: ['dist/**/*'],
        },
        options: {
          port: 3030,
          open: true,
          server: {
            baseDir: './dist',
          },
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-swig-templates');
  grunt.loadNpmTasks('grunt-useref');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-stylelint');

  // hack useref 配置的 concat plugin 问题
  grunt.registerTask('hack_useref', function () {
    const concatConfig = grunt.config('concat');
    function replaceNodeModules() {
      return Reflect.ownKeys(concatConfig).reduce((p, c) => {
        const currentValue = concatConfig[c];
        const nextValue = currentValue.map((v) =>
          v.includes('node_modules') ? v.replace('temp/', '') : v
        );
        return { ...p, [c]: nextValue };
      }, {});
    }
    grunt.config('concat', replaceNodeModules());
  });

  // lint
  grunt.registerTask('lint', ['stylelint', 'eslint']);
  // compile
  grunt.registerTask('compile', ['swig', 'sass', 'babel']);
  // serve
  grunt.registerTask('serve', ['compile', 'copy', 'browserSync:dev', 'watch']);
  // build
  grunt.registerTask('build', [
    'clean',
    'compile',
    'copy',
    'imagemin',
    'useref',
    'hack_useref',
    'concat',
    'htmlmin',
    'cssmin',
    'uglify',
    'clean:temp',
  ]);
  // start
  grunt.registerTask('start', ['build', 'browserSync:start']);
  // ghpages
  grunt.registerTask('gh-pages', function () {
    const done = this.async();
    ghpages.publish(path.join(__dirname, 'dist'), function (err) {
      done(err);
    });
  });
  // deploy
  grunt.registerTask('deploy', ['build', 'gh-pages']);
};
