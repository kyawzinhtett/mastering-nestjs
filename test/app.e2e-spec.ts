import { Test } from '@nestjs/testing';
import { request, spec } from 'pactum';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto/edit-user.dto';
import { CreateBookmarkDto, EditBookmarkDto } from 'src/bookmark/dto';

describe('App E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDB();

    request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Module', () => {
    const dto: AuthDto = {
      email: 'test@test.com',
      password: 'p@ssword',
    };

    describe('Signup', () => {
      it('Should not Signup without email', () => {
        return spec()
          .post('/auth/signup')
          .withBody(dto.password)
          .expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should not Signup without password', () => {
        return spec()
          .post('/auth/signup')
          .withBody(dto.email)
          .expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should not Signup without body', () => {
        return spec().post('/auth/signup').expectStatus(400);
      });
    });

    describe('Signup', () => {
      it('Should Signup', () => {
        return spec().post('/auth/signup').withBody(dto).expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without email', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto.password)
          .expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without password', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto.email)
          .expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should not Signin without body', () => {
        return spec().post('/auth/signin').expectStatus(400);
      });
    });

    describe('Signin', () => {
      it('Should Signin', () => {
        return spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAccessToken', 'access_token')
          .stores('userId', 'id');
      });
    });
  });

  describe('User Module', () => {
    const userDto: EditUserDto = {
      email: 'test@user.com',
      firstName: 'Test',
    };

    describe('Get me', () => {
      it('Should get current user', () => {
        return spec()
          .get('/users/me')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('Should edit current user', () => {
        return spec()
          .patch('/users')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withBody(userDto)
          .expectStatus(200)
          .expectBodyContains(userDto.email)
          .expectBodyContains(userDto.firstName);
      });
    });
  });

  describe('Bookmark Module', () => {
    describe('Create bookmark', () => {
      const bookmarkDto: CreateBookmarkDto = {
        title: 'The Fall',
        link: 'https://en.wikipedia.org/wiki/The_Fall_(Camus_novel)',
        description: 'The Fall by Albert Camus',
      };
      it('Should create bookmark', () => {
        return spec()
          .post('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withBody({ ...bookmarkDto, userId: '$S{userId}' })
          .expectStatus(201)
          .stores('bookmarkId', 'id')
          .expectBodyContains(bookmarkDto.title)
          .expectBodyContains(bookmarkDto.link)
          .expectBodyContains(bookmarkDto.description);
      });
    });

    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return spec()
          .get('/bookmarks')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('Get bookmark By Id', () => {
      it('Should get bookmark by id', () => {
        return spec()
          .get('/bookmarks/{id}')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .expectStatus(200);
      });
    });

    describe('Edit bookmark by Id', () => {
      const bookmarkDto: EditBookmarkDto = {
        title: 'The Fall (Albert Camus)',
      };
      it('Should edit bookmark', () => {
        return spec()
          .patch('/bookmarks/{id}')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .withBody({ ...bookmarkDto, userId: '$S{userId}' })
          .expectStatus(200)
          .expectBodyContains(bookmarkDto.title);
      });
    });

    describe('Delete bookmark by Id', () => {
      it('Should delete bookmark', () => {
        return spec()
          .delete('/bookmarks/{id}')
          .withHeaders('Authorization', 'Bearer $S{userAccessToken}')
          .withPathParams({ id: '$S{bookmarkId}' })
          .expectStatus(204);
      });
    });
  });
});
