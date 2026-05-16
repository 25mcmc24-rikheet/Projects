#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define RED 1
#define BLACK 0

typedef struct Player {
    int id;
    char name[50];
    int score;
} Player;

typedef struct Node {
    Player p;
    int color;
    struct Node *left, *right, *parent;
} Node;

Node *NIL;
Node *root;
int nextId = 1;

void initNIL() {
    NIL = (Node*)malloc(sizeof(Node));
    NIL->color = BLACK;
    NIL->left = NIL->right = NIL->parent = NULL;
}

Node* createNode(Player p) {
    Node* n = (Node*)malloc(sizeof(Node));
    n->p = p;
    n->color = RED;
    n->left = n->right = NIL;
    n->parent = NULL;
    return n;
}

void freeTree(Node *r) {
    if (r != NIL && r != NULL) {
        freeTree(r->left);
        freeTree(r->right);
        free(r);
    }
}

void leftRotate(Node **rootRef, Node *x) {
    Node *y = x->right;
    x->right = y->left;
    if (y->left != NIL) 
        y->left->parent = x;
    y->parent = x->parent;
    if (x->parent == NULL) *rootRef = y;
    else if (x == x->parent->left) 
    x->parent->left = y;
    else 
    x->parent->right = y;
    y->left = x;
    x->parent = y;
}

void rightRotate(Node **rootRef, Node *y) {
    Node *x = y->left;
    y->left = x->right;
    if (x->right != NIL) 
    x->right->parent = y;
    x->parent = y->parent;
    if (y->parent == NULL) 
    *rootRef = x;
    else if (y == y->parent->left) 
    y->parent->left = x;
    else 
    y->parent->right = x;
    x->right = y;
    y->parent = x;
}

void fixInsert(Node **rootRef, Node *z) {
    while (z->parent != NULL && z->parent->color == RED) {
        Node *gp = z->parent->parent;
        if (z->parent == gp->left) {
            Node *u = gp->right;
            if (u->color == RED) {
                z->parent->color = BLACK;
                u->color = BLACK;
                gp->color = RED;
                z = gp;
            } else {
                if (z == z->parent->right) {
                    z = z->parent;
                    leftRotate(rootRef, z);
                }
                z->parent->color = BLACK;
                gp->color = RED;
                rightRotate(rootRef, gp);
            }
        } else {
            Node *u = gp->left;
            if (u->color == RED) {
                z->parent->color = BLACK;
                u->color = BLACK;
                gp->color = RED;
                z = gp;
            } else {
                if (z == z->parent->left) {
                    z = z->parent;
                    rightRotate(rootRef, z);
                }
                z->parent->color = BLACK;
                gp->color = RED;
                leftRotate(rootRef, gp);
            }
        }
    }
    (*rootRef)->color = BLACK;
}

void insertPlayer(Player p) {
    Node *n = createNode(p);
    Node *y = NULL;
    Node *x = root;

    while (x != NIL) {
        y = x;
        if (p.score > x->p.score) 
        x = x->right;
        else if (p.score < x->p.score) 
        x = x->left;
        else {
            if (p.id < x->p.id) 
            x = x->right;
            else 
            x = x->left;
        }
    }

    n->parent = y;
    if (y == NULL) 
    root = n;
    else if (p.score > y->p.score) 
    y->right = n;
    else if (p.score < y->p.score) 
    y->left = n;
    else {
        if (p.id < y->p.id) 
        y->right = n;
        else 
        y->left = n;
    }
    fixInsert(&root, n);
}

void transplant(Node **rootRef, Node *u, Node *v) {
    if (u->parent == NULL) 
    *rootRef = v;
    else if (u == u->parent->left) 
    u->parent->left = v;
    else 
    u->parent->right = v;
    v->parent = u->parent;
}

Node* minNode(Node* n) {
    while (n->left != NIL)
     n = n->left;
    return n;
}

void fixDelete(Node **rootRef, Node *x) {
    while (x != *rootRef && x->color == BLACK) {
        if (x == x->parent->left) {
            Node *w = x->parent->right;
            if (w->color == RED) {
                w->color = BLACK;
                x->parent->color = RED;
                leftRotate(rootRef, x->parent);
                w = x->parent->right;
            }
            if (w->left->color == BLACK && w->right->color == BLACK) {
                w->color = RED;
                x = x->parent;
            } else {
                if (w->right->color == BLACK) {
                    w->left->color = BLACK;
                    w->color = RED;
                    rightRotate(rootRef, w);
                    w = x->parent->right;
                }
                w->color = x->parent->color;
                x->parent->color = BLACK;
                w->right->color = BLACK;
                leftRotate(rootRef, x->parent);
                x = *rootRef;
            }
        } else {
            Node *w = x->parent->left;
            if (w->color == RED) {
                w->color = BLACK;
                x->parent->color = RED;
                rightRotate(rootRef, x->parent);
                w = x->parent->left;
            }
            if (w->right->color == BLACK && w->left->color == BLACK) {
                w->color = RED;
                x = x->parent;
            } else {
                if (w->left->color == BLACK) {
                    w->right->color = BLACK;
                    w->color = RED;
                    leftRotate(rootRef, w);
                    w = x->parent->left;
                }
                w->color = x->parent->color;
                x->parent->color = BLACK;
                w->left->color = BLACK;
                rightRotate(rootRef, x->parent);
                x = *rootRef;
            }
        }
    }
    x->color = BLACK;
}

Node* search(Node *r, int id) {
    if (r == NIL) return NULL;
    if (r->p.id == id) return r;
    Node *l = search(r->left, id);
    if (l) 
    return l;
    return search(r->right, id);
}

// Node* searchByScore(Node *r, int score) {
//     while (r != NIL) {
//         if (score == r->p.score)
//             return r;

//         else if (score < r->p.score)
//             r = r->left;

//         else
//             r = r->right;
//     }

//     return NULL;
// }

// Node* searchByScoreId(Node *r, int score, int id) {
//     while (r != NIL) {

//         if (score == r->p.score &&
//             id == r->p.id)
//             return r;

//         else if (score < r->p.score)
//             r = r->left;

//         else if (score > r->p.score)
//             r = r->right;

//         else {
//             if (id < r->p.id)
//                 r = r->right;
//             else
//                 r = r->left;
//         }
//     }

//     return NULL;
// }

int deletePlayer(int id) {
    Node *z = search(root, id);
    if (!z) return 0;
    Node *y = z, *x;
    int yCol = y->color;
    if (z->left == NIL) { x = z->right; transplant(&root, z, z->right); }
    else if (z->right == NIL) { x = z->left; transplant(&root, z, z->left); }
    else {
        y = minNode(z->right);
        yCol = y->color; x = y->right;
        if (y->parent == z) x->parent = y;
        else { transplant(&root, y, y->right); y->right = z->right; y->right->parent = y; }
        transplant(&root, z, y); y->left = z->left; y->left->parent = y; y->color = z->color;
    }
    free(z);
    if (yCol == BLACK) fixDelete(&root, x);
    return 1;
}

void displayWithRank(Node *r, int *rank) {
    if (r == NIL) return;
    displayWithRank(r->right, rank);
    (*rank)++;
    printf("%-6d %-6d %-15s %-6d\n", *rank, r->p.id, r->p.name, r->p.score);
    displayWithRank(r->left, rank);
}

int searchWithRank(Node *r, int id, int *rank) {
    if (r == NIL) return 0;
    if (searchWithRank(r->right, id, rank)) return 1;
    (*rank)++;
    if (r->p.id == id) {
        printf("Name: %s | Rank: %d | Score: %d\n", r->p.name, *rank, r->p.score);
        return 1;
    }
    return searchWithRank(r->left, id, rank);
}

void displayRange(Node *r, int start, int end, int *rank) {
    if (r == NIL) return;
    displayRange(r->right, start, end, rank);
    (*rank)++;
    if (*rank >= start && *rank <= end)
        printf("%-6d %-6d %-15s %-6d\n", *rank, r->p.id, r->p.name, r->p.score);
    displayRange(r->left, start, end, rank);
}

void displayScoreRange(Node *r, int low, int high, int *rank, int *found) {
    if (r == NIL) return;
    displayScoreRange(r->right, low, high, rank, found);
    (*rank)++;
    if (r->p.score >= low && r->p.score <= high) {
        printf("%-6d %-6d %-15s %-6d\n", *rank, r->p.id, r->p.name, r->p.score);
        *found = 1;
    }
    displayScoreRange(r->left, low, high, rank, found);
}

int countPlayers(Node *r) {
    if (r == NIL) return 0;
    return 1 + countPlayers(r->left) + countPlayers(r->right);
}

int idExists(Node *r, int id) {
    if (r == NIL) return 0;
    if (r->p.id == id) return 1;
    return idExists(r->left, id) || idExists(r->right, id);
}

void saveAll(Node *r, FILE *fp) {
    if (r != NIL) {
        saveAll(r->left, fp);
        fwrite(&r->p, sizeof(Player), 1, fp);
        saveAll(r->right, fp);
    }
}

void saveFile() {
    FILE *fp = fopen("players.dat", "wb");
    if (!fp) { printf("Error saving file\n"); return; }
    saveAll(root, fp);
    fclose(fp);
    printf("Data saved successfully\n");
}

void clearAll() {
    freeTree(root);
    root = NIL;
    FILE *fp = fopen("players.dat", "wb");
    if (fp) 
    fclose(fp);
    nextId = 1;
}

void loadFile() {
    FILE *fp = fopen("players.dat", "rb");
    if (!fp) { printf("No file found\n"); return; }
    //clearAll();
    rewind(fp);//ensure start
    Player p;
    while (fread(&p, sizeof(Player), 1, fp)) {
        insertPlayer(p);
        if (p.id >= nextId) nextId = p.id + 1;
    }
    fclose(fp);
    printf("--- Data loaded successfully ---\n");
}



int main() {
    initNIL();
    root = NIL;

    int ch;
    while (1) {
        printf("\n1.Insert \n2.Search \n3.Display \n4.Update \n5.Delete \n6.Count \n7.Rank Range \n8.Score Range \n9.Save \n10.Load \n11.Clear \n12.Exit \nChoice: ");
        if (scanf("%d", &ch) != 1) { while(getchar()!='\n'); continue; }

        switch (ch) {
            case 1: {
                Player p; int valid = 0;
                while (!valid) {
                    char input[50];

                    printf("Enter ID: ");
                    scanf("%s", input);
                    while(getchar()!='\n');

                    int validNum = 1;
                    for (int i = 0; input[i]; i++) {
                        if (input[i] < '0' || input[i] > '9') {
                            validNum = 0;
                            break;
                        }
                    }
                    if (!validNum) {
                        printf("Invalid ID. Only numbers allowed.\n");
                        continue;
                    }
                    p.id = atoi(input);
                    if (idExists(root, p.id)) 
                    printf("ID already exists!\n");
                    else valid = 1;
                }
                printf("Enter name: "); 
                scanf("%[^\n]", p.name);
                
                valid = 0;
                while (!valid) {
                    printf("Enter score (0-100): "); 
                    // scanf("%d", &p.score);
                    
                    if(scanf("%d",&p.score)!=1)
                    {
                        while(getchar()!='\n');
                        printf("Invalid input.Enter a number. \n");
                        continue;
                    }
                    if (p.score < 0 || p.score > 100) 
                    printf("Score must be 0-100.\n");
                    else valid = 1;
                }
                insertPlayer(p);
                printf("--- Insertion Complete ---\n");
                break;
            }

            
            case 2: {
                int id, r = 0; 
                printf("Enter ID: "); 
                scanf("%d", &id);
                if (!searchWithRank(root, id, &r)) 
                printf("Player not found\n");
                break;
            }
            case 3: {
                int r = 0;
                if (root == NIL) 
                printf("\nNo players found\n");
                else {
                    printf("\nRank   ID     Name            Score\n");
                    displayWithRank(root, &r);
                }
                break;
            }
            case 4: {
                int id;
                printf("Enter ID: "); 
                scanf("%d", &id);
                Node *n = search(root, id);
                if (n) {
                    Player temp = n->p; 
                    deletePlayer(id);
                    printf("Enter new score: "); 
                    scanf("%d", &temp.score);
                    insertPlayer(temp);
                    printf("--- Score Updated Successfully ---\n");
                } else 
                printf("Player not found\n");
                break;
            }
            case 5: {
                int id;
                printf("Enter ID: "); 
                scanf("%d", &id);
                if (deletePlayer(id)) 
                printf("--- Player Deleted Successfully ---\n");
                else 
                printf("Player not found\n");
                break;
            }
            case 6: 
            printf("Total Players: %d\n", countPlayers(root)); 
            break;

            case 7: {
                int s, e, r = 0; 
                printf("Start rank: "); 
                scanf("%d", &s);
                printf("End rank: "); 
                scanf("%d", &e);
                int total = countPlayers(root);
                if (s <= 0 || s > total || s > e) 
                printf("Invalid range\n");
                else {
                    printf("\nRank   ID     Name            Score\n");
                    displayRange(root, s, e, &r);
                }
                break;
            }
            case 8: {
                int low, high, r = 0, f = 0;
                printf("Min score: "); 
                scanf("%d", &low);
                printf("Max score: "); 
                scanf("%d", &high);
                printf("\nRank   ID     Name            Score\n");
                displayScoreRange(root, low, high, &r, &f);
                if (!f) 
                printf("No players in this range\n");
                break;
            }
            case 9: 
            saveFile(); 
            break;

            case 10:
            loadFile();
            break;

            case 11:
            clearAll(); 
            printf("--- All Data Cleared ---\n"); 
            break;

            case 12:
            freeTree(root); 
            free(NIL); 
            return 0;
        }
    }
}