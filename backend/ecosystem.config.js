// PM2, same layout as the other apps on the VPS.
// One process: the flight reminder and the daily summary run inside this process.
// Secrets stay in backend/.env. This file only forces production mode.
module.exports = {
    apps: [
        {
            name: 'BACKEND - FLEETRUST',
            script: 'server.js',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
