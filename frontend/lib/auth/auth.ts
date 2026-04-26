export type User = {
  id: string;
  email: string;
};

export type UserCallback = (user: User | null, error?: Error) => void;

export class Auth {
  constructor(
    public user: User | null,
    public userCallback: UserCallback | null,
    public error?: Error
  ) {}

  onAuthStateChanged(callback: UserCallback) {
    this.userCallback = callback;

    return () => {
      this.userCallback = null;
    };
  }

  protected onUserChange(user: User | null, error?: Error) {
    this.userCallback?.(user, error);
  }

  signIn();
}
