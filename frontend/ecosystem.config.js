// PM2. Next listens only on this machine; nginx publishes it.
// NEXT_PUBLIC_* are read from frontend/.env at `npm run build`, not from here.
module.exports = {
    apps: [
        {
            name: 'FRONTEND - FLEETRUST',
            script: 'node_modules/next/dist/bin/next',
            args: 'start --hostname 127.0.0.1 --port 3010',
            cwd: __dirname,
            instances: 1,
            exec_mode: 'fork',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
};
