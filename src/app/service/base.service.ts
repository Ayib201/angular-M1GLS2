import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export abstract class BaseService<
  T,
  CreateT,
  UpdateT,
  TKey extends string | number = number,
>
{
  protected readonly httpClient = inject(HttpClient);
  constructor(
    protected readonly resourcePath: string // ex: '/users', '/zones'
  ) {}

  async findAll(): Promise<T[]> {
    try {
      return await firstValueFrom(
        this.httpClient.get<T[]>(this.resourcePath)
      );
    } catch (error) {
      console.error(`Failed to fetch all items from ${this.resourcePath}:`, error);
      throw error;
    }
  }

  async findById(id: TKey): Promise<T | null> {
    const url = `${this.resourcePath}/${String(id)}`;
    try {
      return await firstValueFrom(
        this.httpClient.get<T>(url)
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      console.error(`Failed to fetch item from ${url}:`, error);
      throw error;
    }
  }

  async create(data: CreateT): Promise<T> {
    try {
      return await firstValueFrom(
        this.httpClient.post<T>(this.resourcePath, data)
      );
    } catch (error) {
      console.error(`Failed to create item at ${this.resourcePath}:`, error);
      throw error;
    }
  }

  async update(id: TKey, data: UpdateT): Promise<T> {
    const url = `${this.resourcePath}/${String(id)}`;
    try {
      return await firstValueFrom(
        this.httpClient.put<T>(url, data)
      );
    } catch (error) {
      console.error(`Failed to update item at ${url}:`, error);
      throw error;
    }
  }

  async delete(id: TKey): Promise<boolean> {
    const url = `${this.resourcePath}/${String(id)}`;
    try {
      await firstValueFrom(
        this.httpClient.delete(url)
      );
      return true;
    } catch (error) {
      console.error(`Failed to delete item at ${url}:`, error);
      throw error;
    }
  }

}
