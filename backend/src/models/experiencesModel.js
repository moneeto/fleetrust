const GONE = 'Experiences catalog was replaced by services';

async function getExperiences() {
    return [];
}

async function getExperienceByCode() {
    return [];
}

async function createExperience() {
    throw GONE;
}

async function updateExperience() {
    throw GONE;
}

async function deleteExperience() {
    throw GONE;
}

module.exports = {
    getExperiences,
    getExperienceByCode,
    createExperience,
    updateExperience,
    deleteExperience,
};
