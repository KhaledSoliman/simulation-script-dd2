const fs = require('fs');
const {exec} = require('child_process');
const log4js = require('log4js');
const directory = __dirname + '/cirs/';
const Cinv = [37.3, 74.6, 149, 298];
const Transient = [0.00, 166.7, 666.7, 1333.3];

log4js.configure({
    appenders: {report: {type: 'file', filename: 'report.log'}},
    categories: {default: {appenders: ['report'], level: 'info'}}
});
const logger = log4js.getLogger('report');

//readAndWriteFiles(directory, onFileContent, onError);
readFileNamesAndLog(directory, logFile, onError);

function simulate(filename) {
    console.log("Working on file: " + filename);
    const cmd = 'wine ~/.wine/drive_c/Program\\ Files\\ \\(x86\\)/LTC/LTspiceIV/scad3.exe -run ./cirs/' + filename;
    console.log(cmd);
    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            // node couldn't execute the command
            console.log(err);
            return;
        }
        // fs.readFile('./cirs/' + filename.substring(0, filename.length - 4) + '.log', 'utf-8', function (err, content) {
        //     if (err) {
        //         onError(err);
        //     }
        //
        //     let tpdrString = content.match(/tpdr=[\w*-.]+ FROM/g)[0];
        //     tpdrString = tpdrString.substring(0, tpdrString.length - 5);
        //     let tpdfString = content.match(/tpdf=[\w*-.]+ FROM/g)[0];
        //     tpdfString = tpdfString.substring(0, tpdfString.length - 5);
        //     logger.info(tpdrString + ' | ' + tpdfString);
        // });
        // // the *entire* stdout and stderr (buffered)
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
    });
}


function onFileContent(filename, content) {
    Cinv.forEach(cLoad => {
        const modCinv = content.replace(/cload out 0 250fF/g, `cload out 0 ${cLoad}fF`);
        fs.writeFile(directory + filename.substring(0, filename.length - 4) + `_T1n_C${cLoad}fF.cir`, modCinv, 'utf8', function (err) {
            if (err) return console.log(err);
        });
        Transient.forEach(transientTime => {
            const modTransient = modCinv.replace(/0 pulse 0 5 10n 1n 1n 10n 22n/g, `0 pulse 0 5 10n ${transientTime}n ${transientTime}n 10n 22n`);
            fs.writeFile(directory + filename.substring(0, filename.length - 4) + `_T${transientTime}_C${cLoad}fF.cir`, modTransient, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        });
    });
    readFileNames(directory, simulate, onError);
}

function onError(err) {
    console.log(err);
}

function readFileNames(dirname, onFileName, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            onFileName(filename);
        });
    });
}

function logFile(filename, content) {
    logger.info('=============== ' + filename.substring(0, filename.length - 4) + ' ===============');
    try {
        let tpdrString = content.match(/tpdr=[\w*-.]+ FROM/g)[0];
        tpdrString = tpdrString.substring(0, tpdrString.length - 5);
        let tpdfString = content.match(/tpdf=[\w*-.]+ FROM/g)[0];
        tpdfString = tpdfString.substring(0, tpdfString.length - 5);
        logger.info(tpdrString + ' | ' + tpdfString);
    } catch (e) {
        logger.info("FAIL | FAIL");
    }
}

function readFileNamesAndLog(dirname, onFileName, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            if (filename.substr(filename.length - 4, filename.length) === ".log")
                fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                    if (err) {
                        onError(err);
                        return;
                    }
                    onFileName(filename, content);
                });
        });
    });
}

function readAndWriteFiles(dirname, onFileContent, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            fs.readFile(dirname + filename, 'utf-8', function (err, content) {
                if (err) {
                    onError(err);
                    return;
                }
                onFileContent(filename, content);
            });
        });
    });
}
