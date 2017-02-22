module.exports = {
    extractAnswer: function(response) {
        if(response == null || response == undefined) {
            return "";
        }

        if(response.entity) {
            return response.entity.toString().toLocaleLowerCase().trim();
        }
        else {
            return response.toString().toLocaleLowerCase().trim();
        }
    },
    normalizeResponse: function(s) {
        return s.toString().toLocaleLowerCase()
            .replace(/à|á|ä|â|å|ã|ā|ă|ą/g, 'a')
            .replace(/è|é|ê|ë|ē|ė|ę|ě/g, 'e')
            .replace(/ù|ú|ü|û/g, 'u')
            .replace(/ò|ó|ö|ô|õ/g, 'o')
            .replace(/ì|í|î|ï|ĩ|ī|ĭ/g, 'i')
            .replace(/[^a-z0-9]/g, ' ')
            .trim()
        ;
    }
};
