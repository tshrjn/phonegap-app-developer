var wd = require('wd'),
    asserters = wd.asserters,
    exec = require('child_process').exec,
    os = require('os'),
    path = require('path'),
    phonegap = require('../../phonegap-cli');

describe('PhoneGap Developer App', function() {
    var app, browser, originalTimeout,
        tempDir = path.join(os.tmpdir(), 'temp-app');

    beforeEach(function() {
        // change Jasmine default timeouts
        originalTimeout = jasmine.currentEnv_.defaultTimeoutInterval;
        jasmine.currentEnv_.defaultTimeoutInterval = 120000;

        browser = wd.promiseChainRemote('localhost', 4723);
    
        // device options
        var browserOptions = {
            deviceName: 'iPhone 6',
            platformVersion: '9.0',
            platformName: 'iOS',
            app: path.join(__dirname, '..', 'platforms/ios/build/emulator/PhoneGap.app'),
            autoWebview: true,
            implicitWaitMs: 500
        };

        app = browser.init(browserOptions);

        exec('phonegap create ', tempDir);
    });

    afterEach(function(done) {
        jasmine.currentEnv_.defaultTimeoutInterval = originalTimeout;
        browser.quit().then(done);

        exec('rm -rf ', tempDir);
    });
    
    it('should launch served app', function(done) {
        var success = function(el) {
            expect(el).toBeDefined();
            return el;
        };
        var error = function(err) {
            expect(err).toBeUndefined();
        };

        // serve temp project
        var serve = exec('phonegap serve', {cwd: tempDir});
        serve.stdout.on('data', function(data) {
            console.log(data.toString('utf8'));
        });

        // Running the Developer App
        app
        .title()
        .then(function(title) {
            expect(title).toEqual("PhoneGap Developer App");
        })
        .waitForElementById('address', asserters.isDisplayed, 2000, 200)
        .then(success, error)
        .clear()
        .type('localhost:3000')
        .elementById('connect')
        .then(success, error)
        .click()
        .waitForElementByClassName('received', asserters.isDisplayed, 2000, 200)
        .then(success, error)
        .fin(function() {
            serve.kill('SIGTERM');
            done();
        });
    });
});
