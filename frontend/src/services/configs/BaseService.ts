import ApiService from './ApiService'
import { AxiosResponse } from 'axios'

export class BaseService {
    protected resourceUrl: string

    constructor(resourceUrl: string) {
        this.resourceUrl = resourceUrl
    }

    public getAll<T = any>(): Promise<AxiosResponse<T>> {
        return ApiService.get<T>(this.resourceUrl)
    }

    public getById<T = any>(id: string | number): Promise<AxiosResponse<T>> {
        return ApiService.get<T>(`${this.resourceUrl}/${id}`)
    }

    public create<T = any>(data: any): Promise<AxiosResponse<T>> {
        return ApiService.post<T>(this.resourceUrl, data)
    }

    public update<T = any>(id: string | number, data: any): Promise<AxiosResponse<T>> {
        return ApiService.put<T>(`${this.resourceUrl}/${id}`, data)
    }

    public delete<T = any>(id: string | number): Promise<AxiosResponse<T>> {
        return ApiService.delete<T>(`${this.resourceUrl}/${id}`)
    }
}

export default BaseService
