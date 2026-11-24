const assert = require('node:assert');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Runs against the real database inside a transaction that is always rolled back.
async function dbCheck() {
    const { pool } = require('../helpers/conexion-mysql');
    const auth = require('./authModel');
    const db = require('./reservationsModel');
    const conn = await new Promise((resolve, reject) => {
        pool.getConnection((err, c) => err ? reject(err) : resolve(c));
    });
    const sql = (q, p) => new Promise((resolve, reject) => conn.query(q, p, (err, rows) => err ? reject(err) : resolve(rows)));
    try {
        await sql('START TRANSACTION');
        const account = await auth.createAccount(conn, { name: 'passengers-check', showSetupModal: 0 });
        const idAccount = account.insertId;
        const newReservation = async () => (await db.createReservation(conn, {
            passengerCount: 3, startDate: '2030-01-01 10:00', endDate: '2030-01-01 11:00', idExperience: null, idService: null,
            idStatus: 1, totalValue: 0, deposit: 0, remainingBalance: 0, reservationExpiration: '2030-01-01 10:00:00',
            idAircraft: null, idPilot: null, idAccount, idUser: null
        })).insertId;
        const ctx = (idReservation) => ({ idReservation, idAccount, idUser: null });

        // holder first; a repeated email inside one reservation must not collapse two people into one
        const first = await newReservation();
        const people = [
            { firstName: 'Ana', lastName: 'Diaz', email: 'a@x.com', phone: '111' },
            { firstName: 'Bob', email: 'a@x.com' },
            { firstName: 'Cy' }
        ];
        await db.savePassengers(conn, { ...ctx(first), people });
        let rows = await db.getPassengersByReservationId(conn, first, idAccount);
        assert.strictEqual(rows.length, 3);
        assert.deepStrictEqual(rows.map((r) => r.holder), [1, 0, 0]);
        assert.strictEqual(rows[0].name, 'Ana');
        assert.strictEqual((await sql('SELECT COUNT(*) n FROM persons WHERE idAccount = ?', [idAccount]))[0].n, 3);

        // saving the same reservation again replaces its passengers instead of duplicating them
        await db.savePassengers(conn, { ...ctx(first), people });
        assert.strictEqual((await db.getPassengersByReservationId(conn, first, idAccount)).length, 3);

        // a later reservation with the same email reuses the person and keeps data it does not resend
        const second = await newReservation();
        await db.savePassengers(conn, { ...ctx(second), people: [{ firstName: 'Ana', lastName: 'Diaz', email: 'a@x.com', weight: 70 }] });
        rows = await db.getPassengersByReservationId(conn, second, idAccount);
        assert.strictEqual(rows.length, 1);
        assert.strictEqual(rows[0].phoneNumber, '111');
        assert.strictEqual(Number(rows[0].weight), 70);

        // listings read the holder through the join
        await db.updateHolder(conn, { ...ctx(second), name: 'Ana', lastname: 'Perez', email: 'a@x.com', phoneNumber: '222' });
        const [listed] = await db.getReservationById(conn, second, idAccount);
        assert.strictEqual(listed.lastname, 'Perez');
        assert.strictEqual(listed.phoneNumber, '222');

        await sql('ROLLBACK');
    } catch (error) {
        await sql('ROLLBACK').catch(() => {});
        throw error;
    } finally {
        conn.release();
    }
    pool.end();
}

dbCheck()
    .then(() => console.log('passengers ok'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
