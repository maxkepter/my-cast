export abstract class ActiveableEntity {
  isActive: boolean = true;

  isActived(): boolean {
    return this.isActive;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
