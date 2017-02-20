module.exports = function() {
    String.prototype.normalizeResponse = function() {
        return this.toString().trim().toLocaleLowerCase()
            .replace(/à|á|ä|â/g, 'a')
            .replace(/è|é|ê/g, 'e')
            .replace(/ù|ú|ü|û/g, 'u')
            .replace(/ò|ó|ö|ô/g, 'o')
            .replace(/ì|í|î/g, 'i')
        ;
    };
}
