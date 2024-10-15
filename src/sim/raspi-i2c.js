/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const NUM_BANKS = 0x13;
const BANK_SIZE = 1000;
const buffer = Buffer.alloc((NUM_BANKS + 1) * BANK_SIZE);

module.exports = {
    readByteSync: (regAddr, bankAddr) => {
        return buffer.readUInt8((bankAddr * BANK_SIZE) + regAddr);
    },
    writeByteSync: (regAddr, bankAddr, data) => {
        try {
        buffer.writeUInt8(data, (bankAddr * BANK_SIZE) + regAddr);
        return data;
        }catch (err) {
            console.error(err)
        }
    }
};
