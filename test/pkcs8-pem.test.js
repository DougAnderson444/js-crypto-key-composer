import fs from 'fs';
import { decomposePrivateKey, composePrivateKey } from '../src';
import { typedArrayToUint8Array } from '../src/util/binary';

const KEYS = {
    'rsa-1': fs.readFileSync('test/fixtures/pkcs8-pem/rsa-1'),
    'rsa-2': fs.readFileSync('test/fixtures/pkcs8-pem/rsa-2'),
};

const password = 'password';

describe('decomposePrivateKey', () => {
    it('should decompose a standard RSA key', () => {
        expect(decomposePrivateKey(KEYS['rsa-1'], { format: 'pkcs8-pem' })).toMatchSnapshot();
    });

    it('should decompose an encrypted RSA key', () => {
        expect(decomposePrivateKey(KEYS['rsa-2'], { format: 'pkcs8-pem', password })).toMatchSnapshot();
    });

    it('should also support Uint8Array, ArrayBuffer and string besides Node\'s Buffer', () => {
        const nodeBuffer = fs.readFileSync('test/fixtures/pkcs8-pem/rsa-1');

        expect(decomposePrivateKey(typedArrayToUint8Array(nodeBuffer), { format: 'pkcs8-pem' })).toMatchSnapshot();
        expect(decomposePrivateKey(typedArrayToUint8Array(nodeBuffer).buffer, { format: 'pkcs8-pem' })).toMatchSnapshot();
        expect(decomposePrivateKey(nodeBuffer.toString('binary'), { format: 'pkcs8-pem' })).toMatchSnapshot();
    });

    it('should fail if the input key is invalid', () => {
        expect.assertions(2);

        try {
            decomposePrivateKey('', { format: 'pkcs8-pem' });
        } catch (err) {
            expect(err.message).toBe('Failed to decode PKCS8 as PEM');
            expect(err.code).toBe('INVALID_INPUT_KEY');
        }
    });
});

describe('composePrivateKey', () => {
    it('should compose a standard RSA key (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(KEYS['rsa-1'], { format: 'pkcs8-pem' });

        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(KEYS['rsa-1'].toString());
    });

    it('should compose an encrypted RSA key (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(KEYS['rsa-2'], { format: 'pkcs8-pem', password });
        const composedKey = composePrivateKey(decomposedKey, { password });

        expect(composedKey).toEqual(KEYS['rsa-2'].toString());
    });
});
