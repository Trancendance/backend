import User from "../models/user.js";

const userModel = new User(null);

export interface UserExistence {
    aliasExists: boolean;
    emailExists: boolean;
}

//verify if alias or email exists in database
export const checkUserExistence = async (alias: string, email: string): Promise<{ aliasExists: boolean; emailExists: boolean }> => {
    const [existingAlias, existingEmail] = await Promise.all([
        userModel.getByAlias(alias),
        userModel.getByEmail(email)
    ]);

    return {
        aliasExists: !!existingAlias,
        emailExists: !!existingEmail
    };
};

//generate the error message 
export const getUserExistenceError = (existence: UserExistence): { error: string } | null => {
    const { aliasExists, emailExists } = existence;

    if (aliasExists && emailExists) {
        return { error: 'Neither the alias nor the email are valid' };
    }

    if (aliasExists) {
        return { error: 'Alias already in use' };
    }

    if (emailExists) {
        return { error: 'Email already registered' };
    }
    
    return null;
};