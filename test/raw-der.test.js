import fs from 'fs';
import { decomposePrivateKey, composePrivateKey, decomposePublicKey, composePublicKey } from '../src';
import { typedArrayToUint8Array } from '../src/util/binary';

const PRIVATE_KEYS = {
    'rsa-1': fs.readFileSync('test/fixtures/raw-der/rsa-1'),
    'rsa-2': fs.readFileSync('test/fixtures/raw-der/rsa-2'),
    'rsa-3': fs.readFileSync('test/fixtures/raw-der/rsa-3'),
    'ec-1': fs.readFileSync('test/fixtures/raw-der/ec-1'),
    'ec-2': fs.readFileSync('test/fixtures/raw-der/ec-2'),
    'ec-3': fs.readFileSync('test/fixtures/raw-der/ec-3'),
    'ec-4': fs.readFileSync('test/fixtures/raw-der/ec-4'),
};

const PUBLIC_KEYS = {
    'rsa-1': fs.readFileSync('test/fixtures/raw-der/rsa-1.pub'),
};

describe('decomposePrivateKey', () => {
    it('should decompose a RSA key', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['rsa-1'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should decompose a RSA key with 3 primes', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['rsa-2'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should decompose a RSA key with 4 primes', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['rsa-3'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should decompose a EC key, secp256k1', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['ec-1'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should decompose a EC key, secp160r1', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['ec-3'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should decompose a EC key, sect193r1', () => {
        expect(decomposePrivateKey(PRIVATE_KEYS['ec-4'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should fail to decompose a compressed EC key', () => {
        try {
            decomposePrivateKey(PRIVATE_KEYS['ec-2'], { format: 'raw-der' });
        } catch (err) {
            expect(err.message).toBe('Uncompressed key points are not supported');
            expect(err.code).toBe('UNSUPPORTED_ALGORITHM');
        }
    });

    it.skip('should fail to if the public key is not present', () => {});

    it('should also support Uint8Array, ArrayBuffer and string besides Node\'s Buffer', () => {
        const nodeBuffer = fs.readFileSync('test/fixtures/raw-der/rsa-1');

        expect(decomposePrivateKey(typedArrayToUint8Array(nodeBuffer), { format: 'raw-der' })).toMatchSnapshot();
        expect(decomposePrivateKey(typedArrayToUint8Array(nodeBuffer).buffer, { format: 'raw-der' })).toMatchSnapshot();
        expect(decomposePrivateKey(nodeBuffer.toString('binary'), { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should fail if the input key is invalid', () => {
        expect.assertions(2);

        try {
            decomposePrivateKey('', { format: 'raw-der' });
        } catch (err) {
            expect(err.message).toMatch('The input key is not one of:');
            expect(err.code).toBe('INVALID_INPUT_KEY');
        }
    });
});

describe('composePrivateKey', () => {
    it('should compose a RSA key (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-1']));
    });

    it('should compose a RSA key with 3 primes (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['rsa-2'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-2']));
    });

    it('should compose a RSA key with 4 primes (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['rsa-3'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-3']));
    });

    it('should compose a EC key, secp256k1 (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['ec-1'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['ec-1']));
    });

    it('should compose a EC key, secp160r1 (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['ec-3'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['ec-3']));
    });

    it('should compose a EC key, sect193r1 (mirroring)', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['ec-4'], { format: 'raw-der' });
        const composedKey = composePrivateKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['ec-4']));
    });

    it('should fail to compose a compressed EC key', () => {
        try {
            composePrivateKey({
                format: 'raw-der',
                keyAlgorithm: {
                    id: 'ec-public-key',
                    namedCurve: 'secp256k1',
                },
                keyData: {
                    d: new Uint8Array(32),
                    x: new Uint8Array(32),
                },
            });
        } catch (err) {
            expect(err.message).toBe('Uncompressed key points are not supported (y must be specified)');
            expect(err.code).toBe('UNSUPPORTED_ALGORITHM');
        }
    });

    it('should fail if the key algorithm is not supported', () => {
        expect.assertions(2);

        try {
            composePrivateKey({
                format: 'raw-der',
                keyAlgorithm: { id: 'foo' },
                keyData: {},
            });
        } catch (err) {
            expect(err.message).toBe('Unsupported key algorithm id \'foo\'');
            expect(err.code).toBe('UNSUPPORTED_ALGORITHM');
        }
    });

    it('should fail if an encryption algorithm was specified', () => {
        expect.assertions(2);

        try {
            composePrivateKey({
                format: 'raw-der',
                encryptionAlgorithm: {},
                keyAlgorithm: { id: 'rsa-encryption' },
                keyData: {},
            });
        } catch (err) {
            expect(err.message).toBe('The RAW DER format does not support encryption');
            expect(err.code).toBe('UNSUPPORTED_ALGORITHM');
        }
    });

    it('should support a string in the key algorithm', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey = composePrivateKey({ ...decomposedKey, keyAlgorithm: 'rsa-encryption' });

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-1']));
    });

    it('should support the \'rsa\' alias as the key algorithm', () => {
        const decomposedKey1 = decomposePrivateKey(PRIVATE_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey1 = composePrivateKey({ ...decomposedKey1, keyAlgorithm: 'rsa' });

        expect(composedKey1).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-1']));

        const decomposedKey2 = decomposePrivateKey(PRIVATE_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey2 = composePrivateKey({ ...decomposedKey2, keyAlgorithm: { id: 'rsa' } });

        expect(composedKey2).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['rsa-1']));
    });

    it('should support the \'ec\' alias as the key algorithm', () => {
        const decomposedKey = decomposePrivateKey(PRIVATE_KEYS['ec-1'], { format: 'raw-der' });
        const composedKey = composePrivateKey({
            ...decomposedKey,
            keyAlgorithm: { id: 'ec', namedCurve: 'secp256k1' },
        });

        expect(composedKey).toEqual(typedArrayToUint8Array(PRIVATE_KEYS['ec-1']));
    });
});

describe('decomposePublicKey', () => {
    it('should decompose a RSA key', () => {
        expect(decomposePublicKey(PUBLIC_KEYS['rsa-1'], { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should also support Uint8Array, ArrayBuffer and string besides Node\'s Buffer', () => {
        const nodeBuffer = fs.readFileSync('test/fixtures/raw-der/rsa-1.pub');

        expect(decomposePublicKey(typedArrayToUint8Array(nodeBuffer), { format: 'raw-der' })).toMatchSnapshot();
        expect(decomposePublicKey(typedArrayToUint8Array(nodeBuffer).buffer, { format: 'raw-der' })).toMatchSnapshot();
        expect(decomposePublicKey(nodeBuffer.toString('binary'), { format: 'raw-der' })).toMatchSnapshot();
    });

    it('should fail if the input key is invalid', () => {
        expect.assertions(2);

        try {
            decomposePublicKey('', { format: 'raw-der' });
        } catch (err) {
            expect(err.message).toMatch('The input key is not one of:');
            expect(err.code).toBe('INVALID_INPUT_KEY');
        }
    });
});

describe('composePublicKey', () => {
    it('should compose a RSA key (mirroring)', () => {
        const decomposedKey = decomposePublicKey(PUBLIC_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey = composePublicKey(decomposedKey);

        expect(composedKey).toEqual(typedArrayToUint8Array(PUBLIC_KEYS['rsa-1']));
    });

    it('should fail if the key algorithm is not supported', () => {
        expect.assertions(2);

        try {
            composePublicKey({
                format: 'raw-der',
                keyAlgorithm: { id: 'foo' },
                keyData: {},
            });
        } catch (err) {
            expect(err.message).toBe('Unsupported key algorithm id \'foo\'');
            expect(err.code).toBe('UNSUPPORTED_ALGORITHM');
        }
    });

    it('should support a string in the key algorithm', () => {
        const decomposedKey = decomposePublicKey(PUBLIC_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey = composePublicKey({ ...decomposedKey, keyAlgorithm: 'rsa-encryption' });

        expect(composedKey).toEqual(typedArrayToUint8Array(PUBLIC_KEYS['rsa-1']));
    });

    it('should support the \'rsa\' alias as the key algorithm', () => {
        const decomposedKey1 = decomposePublicKey(PUBLIC_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey1 = composePublicKey({ ...decomposedKey1, keyAlgorithm: 'rsa' });

        expect(composedKey1).toEqual(typedArrayToUint8Array(PUBLIC_KEYS['rsa-1']));

        const decomposedKey2 = decomposePublicKey(PUBLIC_KEYS['rsa-1'], { format: 'raw-der' });
        const composedKey2 = composePublicKey({ ...decomposedKey2, keyAlgorithm: { id: 'rsa' } });

        expect(composedKey2).toEqual(typedArrayToUint8Array(PUBLIC_KEYS['rsa-1']));
    });
});
